import os

def delete_txt_files(directory_path):
    try:
        txt_files = [file for file in os.listdir(directory_path) if file.endswith(".txt")]
        if not txt_files:
            print("No .txt files found in the directory.")
            return

        confirmation = input("Are you sure you want to delete these files? (Y/N): ").strip().lower()
        if confirmation == "y":
            for txt_file in txt_files:
                file_path = os.path.join(directory_path, txt_file)
                os.remove(file_path)
            print("All .txt files deleted successfully.")
        else:
            print("Operation canceled.")

    except FileNotFoundError:
        print(f"Directory not found: {directory_path}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Replace 'your_directory_path_here' with the actual directory path where you want to delete .txt files.
    directory_path = "puzzles/"
    delete_txt_files(directory_path)